import React from 'react';
import { Input, Select, DatePicker, Space, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useResponsive } from '../../hooks/useResponsive';
import debounce from 'lodash/debounce';
import './ResponsiveFilters.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ResponsiveFilters = ({
    onSearch,
    onStatusChange,
    onCategoryChange,
    onDateRangeChange,
    showDateFilter = false,
    showTypeFilter = false,
    showCategoryFilter = true,
    types = [],
    categories = [],
    placeholder = 'Search...'
}) => {
    const { isMobile } = useResponsive();

    // Debounce search to avoid too many requests
    const debouncedSearch = debounce((value) => {
        onSearch?.(value);
    }, 500);

    const handleSearch = (e) => {
        debouncedSearch(e.target.value);
    };

    return (
        <div className="responsive-filters">
            <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={24} md={8} lg={8} xl={6}>
                    <Input
                        placeholder={placeholder}
                        prefix={<SearchOutlined />}
                        onChange={handleSearch}
                        allowClear
                    />
                </Col>

                {showTypeFilter && (
                    <Col xs={24} sm={12} md={6} lg={6} xl={4}>
                        <Select
                            placeholder="Filter by type"
                            onChange={value => onStatusChange?.(value)}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            {types.map(type => (
                                <Option key={type.value} value={type.value}>
                                    {type.label}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                )}

                {showCategoryFilter && (
                    <Col xs={24} sm={12} md={6} lg={6} xl={4}>
                        <Select
                            placeholder="Filter by category"
                            onChange={value => onCategoryChange?.(value)}
                            allowClear
                            showSearch
                            style={{ width: '100%' }}
                        >
                            {categories.map(category => (
                                <Option key={category} value={category}>
                                    {category}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                )}

                <Col xs={24} sm={12} md={6} lg={6} xl={4}>
                    <Select
                        placeholder="Filter by status"
                        onChange={value => onStatusChange?.(value)}
                        allowClear
                        style={{ width: '100%' }}
                    >
                        <Option value="true">Active</Option>
                        <Option value="false">Inactive</Option>
                    </Select>
                </Col>

                {showDateFilter && (
                    <Col xs={24} sm={12} md={8} lg={8} xl={6}>
                        <RangePicker
                            style={{ width: '100%' }}
                            onChange={onDateRangeChange}
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default ResponsiveFilters;
